IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}
LIBFILES = altPath.o faltPath.o edmonds.o fastEdmonds.o flowMatch.o

.cpp.o:
	${CXX} ${CXXFLAGS} -c $*.cpp 

altPath.o :   ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/UiDlist.h ${IDIR}/altPath.h
faltPath.o :  ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/UiDlist.h ${IDIR}/faltPath.h
edmonds.o :   ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/UiRlist.h ${IDIR}/Partition.h ${IDIR}/edmonds.h
fastEdmonds.o : ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/UiRlist.h ${IDIR}/Partition.h ${IDIR}/fastEdmonds.h
flowMatch.o : ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h \
	      ${IDIR}/UiDlist.h \
	      ${IDIR}/Wflograph.h ${IDIR}/Dheap.h 
match.o :     ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiDlist.h
matchRep.o :  ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiDlist.h

all: ${LIBGA} xfiles

clean:
	rm -f *.o *.exe

${LIBGA} : ${LIBFILES}
	ar -ru ${LIBGA} ${LIBFILES}

xfiles:	match matchRep

match: match.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

matchRep: matchRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@
