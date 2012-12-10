IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
#CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -I ${IDIR}

HFILES = ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	 ${IDIR}/List.h ${IDIR}/augPath.h ${IDIR}/shortPath.h \
	 ${IDIR}/maxCap.h ${IDIR}/capScale.h ${IDIR}/prePush.h \
	 ${IDIR}/ppFifo.h ${IDIR}/ppHiLab.h

OFILES = augPath.o shortPath.o maxCap.o capScale.o dinic.o dinicDtrees.o \
	 prePush.o ppFifo.o ppHiLab.o

XFILES = maxFlo maxFloRep check badCase 

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

${OFILES} : ${HFILES}

all:	${LIBGA} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

maxFlo: maxFlo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

maxFloRep: maxFloRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

badCase: badCase.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
