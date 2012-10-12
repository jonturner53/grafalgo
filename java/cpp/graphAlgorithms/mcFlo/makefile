IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

cycRed.o :   ${IDIR}/stdinc.h ${IDIR}/UiList.h ${IDIR}/Wflograph.h \
	     ${IDIR}/cycRed.h
lcap.o :     ${IDIR}/stdinc.h ${IDIR}/UiList.h ${IDIR}/Dheap.h \
             ${IDIR}/Wflograph.h ${IDIR}/lcap.h
mcFlo.o :    ${IDIR}/stdinc.h ${IDIR}/Wflograph.h
mcFloRep.o : ${IDIR}/stdinc.h ${IDIR}/Wflograph.h
check.o :    ${IDIR}/stdinc.h ${IDIR}/UiList.h ${IDIR}/Wflograph.h

all: ${LIBGA} xfiles

clean:
	rm -f *.o *.exe

${LIBGA}: cycRed.o lcap.o 
	ar -ru ${LIBGA} cycRed.o lcap.o 

xfiles:	mcFlo mcFloRep check

mcFlo: mcFlo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mcFloRep: mcFloRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

