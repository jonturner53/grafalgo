IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}
LIBFILES = augPath.o shortPath.o maxCap.o capScale.o \
	dinic.o dinicDtrees.o prePush.o ppFifo.o ppHiLab.o

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

augPath.o :   	${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	      	${IDIR}/UiList.h ${IDIR}/augPath.h
shortPath.o : 	${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	      	${IDIR}/UiList.h ${IDIR}/augPath.h ${IDIR}/shortPath.h
maxCap.o :    	${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	      	${IDIR}/UiList.h ${IDIR}/augPath.h ${IDIR}/maxCap.h
capScale.o :  	${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	      	${IDIR}/UiList.h ${IDIR}/augPath.h ${IDIR}/capScale.h
dinic.o :    	${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/UiList.h \
		${IDIR}/dinic.h
dinicDtrees.o : ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Pathset.h \
	        ${IDIR}/Dtrees.h ${IDIR}/UiList.h ${IDIR}/dinicDtrees.h
prePush.o :     ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/UiList.h \
		${IDIR}/prePush.h
ppFifo.o :      ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/UiList.h \
		${IDIR}/prePush.h ${IDIR}/ppFifo.h
ppHiLab.o :      ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/UiList.h \
		${IDIR}/prePush.h ${IDIR}/ppHiLab.h
maxFlo.o :      ${IDIR}/stdinc.h ${IDIR}/Flograph.h
maxFloRep.o :   ${IDIR}/stdinc.h ${IDIR}/Flograph.h
check.o :       ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/UiList.h
badCase.o :     ${IDIR}/stdinc.h ${IDIR}/Flograph.h 

all:	${LIBGA} xfiles

clean:
	rm -f *.o *.exe

${LIBGA}: ${LIBFILES}
	ar -ru ${LIBGA} ${LIBFILES}

xfiles:	maxFlo maxFloRep check badCase 

maxFlo: maxFlo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

maxFloRep: maxFloRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

badCase: badCase.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@
